import type { ActionResult } from "@/types/result";

import { saveAnswerAction } from "@/actions/Candidate/saveAnswer/logic";

import type { SaveAnswersBatchInput } from "./schema";

type SaveAnswersBatchResult = {
  savedCount: number;
};

export async function saveAnswersBatchAction(
  payload: SaveAnswersBatchInput,
): Promise<ActionResult<SaveAnswersBatchResult>> {
  let savedCount = 0;

  for (const answer of payload.answers) {
    const result = await saveAnswerAction({
      candidateId: payload.candidateId,
      attemptId: payload.attemptId,
      questionId: answer.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      textAnswer: answer.textAnswer,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    savedCount += 1;
  }

  return {
    success: true,
    data: {
      savedCount,
    },
  };
}
