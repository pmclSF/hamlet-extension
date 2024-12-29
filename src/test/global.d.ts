declare namespace NodeJS {
  interface Global {
    // Define Mocha globals explicitly
    describe: Mocha.SuiteFunction;
    it: Mocha.TestFunction;
    beforeEach: Mocha.HookFunction;
    afterEach: Mocha.HookFunction;
  }
}
