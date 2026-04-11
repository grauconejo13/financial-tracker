import { Response, NextFunction } from 'express';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';

type ChatRole = 'user' | 'assistant';

const MAX_USER_MESSAGE = 2000;
const MAX_HISTORY = 12;

const SYSTEM_PROMPT = `You are "ClearPath Assistant", a helpful guide for the ClearPath student finance web app.
Rules:
- Help with using the app: navigation, features, and light student money tips. Do not pose as a licensed financial advisor.
- Keep answers concise (about 120 words) unless the user asks for more detail.
- App areas: Dashboard (semester, summary, quick links); sidebar: Budget, Ghost, Income, Transactions (filters by category/date, add with **transaction date**, amount, description, accountability reason), Debts, Savings, Currency, Accountability (audit log of reasons), Profile (avatar, 2FA, password).
- If you do not know something specific to their account, say you cannot see their data and suggest where in the app to look.`;

function ruleBasedReply(message: string): string {
  const m = message.toLowerCase().trim();

  if (!m) {
    return (
      'Hi! I can help you use **ClearPath**. Try asking about **transactions**, **budget**, **debts**, **savings**, **accountability**, **profile**, or **two-factor login**. ' +
      'If you are logged in and your project has an AI key configured, I can also answer more freely.'
    );
  }

  if (m.includes('transaction') || m.includes('add money') || m.includes('expense')) {
    return (
      'Open **Transactions** in the sidebar. You can **filter** by category and date, **add** a row (income or expense) with the **transaction date**, amount, description, and a short **reason** (saved in Accountability), and **delete** with a reason. ' +
      'The dashboard shows totals from your logged transactions.'
    );
  }

  if (m.includes('budget')) {
    return 'Use **Budget** in the sidebar to plan spending and limits. Adjust categories there as your semester changes.';
  }

  if (m.includes('debt') || m.includes('owe')) {
    return '**Debts** tracks what you owe. Add or edit entries there and keep amounts up to date as you pay them down.';
  }

  if (m.includes('saving') || m.includes('goal')) {
    return '**Savings** helps with goals and set-asides. You can tie flows to templates where your app supports them.';
  }

  if (m.includes('income')) {
    return '**Income** is where you record money coming in. Keep it aligned with what you also log under **Transactions** if you use both.';
  }

  if (m.includes('ghost')) {
    return '**Ghost** spending is for tracking “invisible” or easy-to-miss expenses so your budget stays realistic.';
  }

  if (m.includes('accountab') || m.includes('reason') || m.includes('history')) {
    return (
      '**Accountability** (sidebar) lists reasons you gave when you **created, edited, or deleted** transactions. ' +
      'It helps you reflect on changes over time.'
    );
  }

  if (m.includes('password') || m.includes('login') || m.includes('log in') || m.includes('2fa') || m.includes('two factor')) {
    return (
      'Use **Log in** / **Register** on the home page when logged out. In **Profile** you can update your account and enable **two-factor authentication** with an authenticator app.'
    );
  }

  if (m.includes('profile') || m.includes('avatar')) {
    return '**Profile** (sidebar or avatar area) is for your name, avatar, security (2FA), and preferences.';
  }

  if (m.includes('currency') || m.includes('exchange')) {
    return '**Currency** in the sidebar is for display or conversion settings your app supports.';
  }

  if (m.includes('semester')) {
    return 'Semester dates can be stored for your account (when **Semester** settings or API are enabled). The **Dashboard** shows days remaining when dates exist.';
  }

  if (m.includes('vercel') || m.includes('deploy') || m.includes('not work') || m.includes('error')) {
    return (
      'If the live site misbehaves: ensure **VITE_API_URL** on Vercel points to your **HTTPS** API and redeploy the frontend. ' +
      'The API host should use the **server** folder (Express), not the React client. Check the README troubleshooting section.'
    );
  }

  if (m.includes('hello') || m.includes('hi ') || m === 'hi') {
    return (
      'Hello! Ask me how to use **Transactions**, **Budget**, **Debts**, **Savings**, **Accountability**, or **Profile**. ' +
      'Logged-in users may get richer answers when an AI key is configured on the server.'
    );
  }

  return (
    'I am not sure I understood. Try asking about **transactions**, **budget**, **debts**, **savings**, **accountability**, **profile**, or **login**. ' +
    'For anything account-specific, check the relevant page in the sidebar — I cannot see your balances.'
  );
}

async function openAiReply(
  userMessage: string,
  history: { role: ChatRole; content: string }[]
): Promise<string> {
  const key = ENV.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI not configured');
  }

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.role, content: h.content.slice(0, 4000) })),
    { role: 'user', content: userMessage.slice(0, MAX_USER_MESSAGE) },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // eslint-disable-next-line no-console
    console.error('OpenAI error', res.status, errText.slice(0, 500));
    throw new Error('AI service temporarily unavailable');
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Empty AI response');
  }
  return text;
}

export const chat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body as {
      message?: string;
      history?: { role: ChatRole; content: string }[];
    };

    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) {
      return res.status(400).json({ message: 'message is required' });
    }
    if (text.length > MAX_USER_MESSAGE) {
      return res.status(400).json({ message: 'message too long' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (h) =>
              h &&
              (h.role === 'user' || h.role === 'assistant') &&
              typeof h.content === 'string'
          )
          .slice(-MAX_HISTORY)
          .map((h) => ({
            role: h.role,
            content: h.content.slice(0, 4000),
          }))
      : [];

    const loggedIn = Boolean(req.user);
    const useAi = loggedIn && Boolean(ENV.OPENAI_API_KEY);

    if (useAi) {
      try {
        const reply = await openAiReply(text, safeHistory);
        return res.json({ reply, source: 'ai' as const });
      } catch {
        const reply = ruleBasedReply(text);
        return res.json({ reply, source: 'faq' as const, note: 'ai_unavailable' });
      }
    }

    const reply = ruleBasedReply(text);
    return res.json({
      reply,
      source: 'faq' as const,
      hint: loggedIn
        ? undefined
        : 'Log in for more detailed help when your server has OPENAI_API_KEY set.',
    });
  } catch (err) {
    next(err);
  }
};
