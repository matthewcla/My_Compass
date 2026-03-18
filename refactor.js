const { Project, StructureKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFilesAtPaths("services/storage.ts");
const sourceFile = project.getSourceFileOrThrow("services/storage.ts");

const sqliteClass = sourceFile.getClass("SQLiteStorage");
const webClass = sourceFile.getClass("WebStorage");
const mockClass = sourceFile.getClass("MockStorage");

const importsText = sourceFile.getImportDeclarations().map(i => i.getText()).join('\n');
const interfaceImports = `import { Platform } from 'react-native';
import { DatabaseManager } from '../db/DatabaseManager';\n`;

const repoMap = {
  UserRepository: {
    sqlite: ["saveUser", "getUser", "mapRowToUser"],
    web: ["saveUser", "getUser"],
    mock: ["saveUser", "getUser", "users"]
  },
  LeaveRepository: {
    sqlite: ["saveLeaveRequest", "getLeaveRequest", "getUserLeaveRequests", "deleteLeaveRequest", "mapRowToLeaveRequest", "saveLeaveBalance", "getLeaveBalance", "mapRowToLeaveBalance", "saveLeaveDefaults", "getLeaveDefaults"],
    web: ["saveLeaveRequest", "getLeaveRequest", "getUserLeaveRequests", "deleteLeaveRequest", "saveLeaveBalance", "getLeaveBalance", "saveLeaveDefaults", "getLeaveDefaults"],
    mock: ["saveLeaveRequest", "getLeaveRequest", "getUserLeaveRequests", "deleteLeaveRequest", "leaveRequests", "saveLeaveBalance", "getLeaveBalance", "leaveBalances", "saveLeaveDefaults", "getLeaveDefaults", "leaveDefaults"]
  },
  BilletRepository: {
    sqlite: ["saveBillet", "getBillet", "getAllBillets", "getBilletCount", "getPagedBillets", "mapRowToBillet"],
    web: ["saveBillet", "getBillet", "getAllBillets", "getBilletCount", "getPagedBillets"],
    mock: ["saveBillet", "getBillet", "getAllBillets", "getBilletCount", "getPagedBillets", "billets"]
  },
  ApplicationRepository: {
    sqlite: ["saveApplication", "saveApplications", "getApplication", "getUserApplications", "deleteApplication", "mapRowToApplication", "saveAssignmentDecision", "removeAssignmentDecision", "getAssignmentDecisions"],
    web: ["saveApplication", "saveApplications", "getApplication", "getUserApplications", "deleteApplication", "saveAssignmentDecision", "removeAssignmentDecision", "getAssignmentDecisions"],
    mock: ["saveApplication", "saveApplications", "getApplication", "getUserApplications", "deleteApplication", "applications", "saveAssignmentDecision", "removeAssignmentDecision", "getAssignmentDecisions", "decisions"]
  },
  DashboardRepository: {
    sqlite: ["saveDashboardCache", "getDashboardCache"],
    web: ["saveDashboardCache", "getDashboardCache"],
    mock: ["saveDashboardCache", "getDashboardCache", "dashboardCache"]
  },
  InboxRepository: {
    sqlite: ["saveInboxMessages", "getInboxMessages", "updateInboxMessageReadStatus", "updateInboxMessagePinStatus"],
    web: ["saveInboxMessages", "getInboxMessages", "updateInboxMessageReadStatus", "updateInboxMessagePinStatus"],
    mock: ["saveInboxMessages", "getInboxMessages", "updateInboxMessageReadStatus", "updateInboxMessagePinStatus", "inboxMessages"]
  },
  CareerRepository: {
    sqlite: ["saveCareerEvents", "getCareerEvents"],
    web: ["saveCareerEvents", "getCareerEvents"],
    mock: ["saveCareerEvents", "getCareerEvents", "careerEvents"]
  },
  PCSRepository: {
    sqlite: ["saveHistoricalPCSOrder", "getUserHistoricalPCSOrders", "getHistoricalPCSOrder", "deleteHistoricalPCSOrder", "mapRowToHistoricalOrder", "savePCSDocument", "getPCSDocument", "getPCSDocuments", "deletePCSDocument", "mapRowToPCSDocument"],
    web: ["saveHistoricalPCSOrder", "getUserHistoricalPCSOrders", "getHistoricalPCSOrder", "deleteHistoricalPCSOrder", "savePCSDocument", "getPCSDocument", "getPCSDocuments", "deletePCSDocument"],
    mock: ["saveHistoricalPCSOrder", "getUserHistoricalPCSOrders", "getHistoricalPCSOrder", "deleteHistoricalPCSOrder", "historicalPCSOrders", "savePCSDocument", "getPCSDocument", "getPCSDocuments", "deletePCSDocument", "pcsDocuments"]
  }
};

const formatMethods = (sourceClass, methodNames) => {
  let output = '';
  if (!sourceClass) return output;
  for (const name of methodNames) {
    const prop = sourceClass.getProperty(name);
    if (prop) {
      output += '  ' + prop.getText() + '\n\n';
      continue;
    }
    const method = sourceClass.getMethod(name);
    if (method) {
      // If SQLite, replace 'this.getDB()' with 'DatabaseManager.getDB()'
      let text = method.getText();
      text = text.replace(/this\.getDB\(\)/g, 'DatabaseManager.getDB()');
      text = text.replace(/this\.withWriteTransaction/g, 'DatabaseManager.withWriteTransaction');
      
      // If Web, replace this.getItem / this.setItem with WebHelpers
      text = text.replace(/this\.setItem/g, 'WebHelpers.setItem');
      text = text.replace(/this\.getItem/g, 'WebHelpers.getItem');
      
      // Replace internal calls like this.mapRowTo...
      text = text.replace(/this\.mapRowTo/g, 'this.mapRowTo'); // actually keeping this is fine if it's in the same class
      
      // If Web has this.getAllBillets inside getPagedBillets
      text = text.replace(/this\.getAllBillets/g, 'this.getAllBillets');
      
      output += '  ' + text + '\n\n';
    }
  }
  return output;
};

// Write DatabaseManager
const dbManagerContent = `${importsText}
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'my_compass.db';

export class DatabaseManager {
  private static dbInstance: SQLite.SQLiteDatabase | null = null;
  private static writeQueue: Promise<void> = Promise.resolve();

  static async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (this.dbInstance) return this.dbInstance;
    this.dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    return this.dbInstance;
  }

  static async enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const queuedOperation = this.writeQueue.then(operation, operation);
    this.writeQueue = queuedOperation.then(() => undefined, () => undefined);
    return queuedOperation;
  }

  static async withWriteTransaction(task: (runner: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
    const db = await this.getDB();
    await this.enqueueWrite(async () => {
      if (Platform.OS === 'web') {
        await db.withTransactionAsync(async () => await task(db));
        return;
      }
      await db.withExclusiveTransactionAsync(async (txn) => await task(txn));
    });
  }

  static async init(): Promise<void> {
    const db = await this.getDB();
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await initializeSQLiteTables(db);
  }
}

export const WebHelpers = {
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
`;
fs.writeFileSync('services/db/DatabaseManager.ts', dbManagerContent);

// Write Repositories
Object.keys(repoMap).forEach(repoName => {
  const map = repoMap[repoName];
  let content = `${importsText}\n${interfaceImports}\nimport { WebHelpers } from '../db/DatabaseManager';\n\n`;
  
  content += `export class SQLite${repoName} {\n${formatMethods(sqliteClass, map.sqlite)}}\n\n`;
  content += `export class Web${repoName} {\n${formatMethods(webClass, map.web)}}\n\n`;
  content += `export class Mock${repoName} {\n${formatMethods(mockClass, map.mock)}}\n\n`;
  
  content += `const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';\n`;
  content += `export const ${repoName.charAt(0).toLowerCase() + repoName.slice(1)} = useMocks\n  ? new Mock${repoName}()\n  : Platform.OS === 'web'\n    ? new Web${repoName}()\n    : new SQLite${repoName}();\n`;
  
  fs.writeFileSync(`services/repositories/${repoName}.ts`, content);
});

console.log("Extraction complete!");
