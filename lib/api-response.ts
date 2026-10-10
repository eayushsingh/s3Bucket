import { NextResponse } from "next/server";
import { StorageError } from "../storage/storage.errors";
import { ZodError } from "zod";

export function formatSuccessResponse(data: any) {
  return {
    success: true,
    data,
  };
}

export function formatErrorResponse(code: string, message: string, details?: any) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json(
    formatSuccessResponse(data),
    { status }
  );
}

export function errorResponse(error: any) {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof StorageError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  const message = error?.message || "Internal server error";
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
    { status: 500 }
  );
}
