interface HoverHintProps {
  text: string;
}

export function HoverHint({ text }: HoverHintProps) {
  return (
    <span className="cp-hover-hint" tabIndex={0} aria-label={text}>
      <span className="cp-hover-hint__dot">?</span>
      <span className="cp-hover-hint__bubble">{text}</span>
    </span>
  );
}

