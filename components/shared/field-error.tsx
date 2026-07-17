export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-destructive text-sm" role="alert">
      {messages[0]}
    </p>
  );
}
