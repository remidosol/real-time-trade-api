import {
  setup,
  shouldNotHappen,
  sleep,
  times,
} from '../../../../tests/testServerSetup.js';

describe('Orders', () => {
  let server, serverSockets, clientSockets, cleanup;

  beforeEach(async () => {
    const testContext = await setup();
    server = testContext.server;
    serverSockets = testContext.serverSockets;
    clientSockets = testContext.clientSockets;
    cleanup = testContext.cleanup;
  });

  afterEach(() => cleanup());
});
