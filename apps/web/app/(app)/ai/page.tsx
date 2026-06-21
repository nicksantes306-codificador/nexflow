import { aiConfigured } from "@/lib/ai/nexflow-ai";
import { perguntar } from "./actions";
import { AiChat } from "./ai-chat";

export const dynamic = "force-dynamic";

export default function AiPage() {
  return <AiChat send={perguntar} configured={aiConfigured()} />;
}
