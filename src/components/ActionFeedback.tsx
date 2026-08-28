interface ActionFeedbackProps {
  feedback: { type: "success" | "error"; message: string } | null;
}

export function ActionFeedback({ feedback }: ActionFeedbackProps) {
  if (!feedback) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 pointer-events-none">
      <div
        className={`text-sm rounded-md px-3 py-2 text-center shadow-sm ${
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}
      >
        {feedback.message}
      </div>
    </div>
  );
}