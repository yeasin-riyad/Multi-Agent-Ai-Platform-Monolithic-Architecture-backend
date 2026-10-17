import {
  deductCreditsService,
  CreditError,
  AGENT_COST,
} from "../../auth/auth.service.js";



export { CreditError, AGENT_COST };

export async function deductCredits({ userId, agent }) {
  return deductCreditsService({ userId, agent });
}

export default deductCredits;