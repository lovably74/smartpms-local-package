import { useState, useCallback } from "react";
import { AIChatBox, Message } from "./AIChatBox";
import { trpc } from "@/lib/trpc";

interface AIChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inline?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "system",
    content: "당신은 SmartPMS의 유능한 프로젝트 관리 및 소프트웨어 개발 어시스턴트입니다. 사용자의 질문에 전문적이고 친절하게 대답하세요. 필요하다면 Markdown 형식을 사용하여 시각적으로 읽기 편하게 제공하세요."
  },
  {
    role: "assistant",
    content: "안녕하세요! SmartPMS AI 어시스턴트입니다. 프로젝트 관리, 이슈 대응, 또는 매뉴얼 등 어떤 도움이 필요하신가요?"
  }
];

export function AIChatPanel({ open, onOpenChange, inline }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response as string },
      ]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      const msg = error.message || "";
      const isQuota = msg.includes("할당량") || msg.includes("quota") || msg.includes("QUOTA");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isQuota
            ? "⚠️ Gemini API 일일 사용 할당량이 초과되었습니다. 잠시 후(약 1분) 다시 시도해 주세요."
            : "죄송합니다. 오류가 발생하여 응답을 가져올 수 없습니다. 다시 시도해 주세요.",
        },
      ]);
    },
  });

  const handleSendMessage = useCallback(
    (content: string) => {
      const newMessages: Message[] = [...messages, { role: "user", content }];
      setMessages(newMessages);
      chatMutation.mutate({ messages: newMessages });
    },
    [messages, chatMutation]
  );

  // inline 모드: Sheet 없이 AIChatBox만 직접 렌더링
  return (
    <AIChatBox
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={chatMutation.isPending}
      placeholder="메시지를 입력하세요..."
      height="100%"
      className="border-0 shadow-none rounded-none w-full h-full"
      suggestedPrompts={[
        "프로젝트 현황 요약해줘",
        "지연된 작업이 있나요?",
        "위키에서 현황조사 매뉴얼 찾아줘"
      ]}
    />
  );
}
