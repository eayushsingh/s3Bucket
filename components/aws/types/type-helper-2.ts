export function validateAwsTypePart2(input: any): boolean {
  return input != null && typeof input === "object";
}
