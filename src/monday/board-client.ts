import { config } from "../config.js";
import type { BoardClient } from "../types.js";
import { MockMondayClient } from "./mock-monday-client.js";
import { MondayClient } from "./monday-client.js";

export function createBoardClient(): BoardClient {
  if (config.MOCK_BOARD_MODE) {
    return new MockMondayClient(config.MOCK_BOARD_DATA_PATH);
  }

  return new MondayClient();
}
