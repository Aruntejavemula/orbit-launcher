import { createHandlers } from "../mocks/createHandlers";
import {
  fakeApiKeys,
  fakeApps,
  fakeCatalog,
  fakePrefs,
  fakeUser,
} from "../mocks/fixtures";

export { fakeApiKeys, fakeApps, fakeCatalog, fakePrefs, fakeUser };

const BASE = "http://localhost/api";

export const handlers = createHandlers(BASE);
