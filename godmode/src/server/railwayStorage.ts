import fs from "fs";
import path from "path";

// Determines the safest directory for persistent storage based on environment
export const getPersistentStorageDir = (): string => {
  const isRailway =
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
  const railwayDir = "/app/data";
  const localDir = path.join(process.cwd(), "data");

  if (isRailway) {
    if (!fs.existsSync(railwayDir)) {
      try {
        fs.mkdirSync(railwayDir, { recursive: true });
        console.log(
          `[Storage] Created persistent volume directory at ${railwayDir}`,
        );
      } catch (e) {
        console.warn(
          `[Storage] Could not create ${railwayDir}, falling back to local dir. Error:`,
          e,
        );
        return _ensureLocalDir(localDir);
      }
    }
    return railwayDir;
  }

  return _ensureLocalDir(localDir);
};

const _ensureLocalDir = (dir: string): string => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

export const writePersistentData = (filename: string, data: any): boolean => {
  try {
    const dir = getPersistentStorageDir();
    const filePath = path.join(dir, filename);
    const content =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to write to ${filename}`, error);
    return false;
  }
};

export const readPersistentData = (
  filename: string,
  defaultData: any = null,
): any => {
  try {
    const dir = getPersistentStorageDir();
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) {
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf8");
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  } catch (error) {
    console.error(`[Storage] Failed to read from ${filename}`, error);
    return defaultData;
  }
};
