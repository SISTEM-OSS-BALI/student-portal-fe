export default function menuLabel(text: string) {
  return (
    <span
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        overflow: "hidden",
        whiteSpace: "normal",
        wordBreak: "break-word",
        lineHeight: 1.25,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}
