const init = jest.fn();

jest.mock('@sentry/nestjs', () => ({ init }));

describe('instrument', () => {
  beforeEach(() => {
    jest.resetModules();
    init.mockClear();
  });

  it('never collects request/response bodies, auto-populated user info, or AI payloads', async () => {
    await import('./instrument');

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dataCollection: {
          userInfo: false,
          httpBodies: [],
          genAI: { inputs: false, outputs: false },
        },
      })
    );
  });
});
