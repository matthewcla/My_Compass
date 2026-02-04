module.exports = {
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
};
