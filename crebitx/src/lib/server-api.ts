import { auth } from "@/auth"
import { api } from "@/lib/api"

type AuthHeaders = {
  Authorization: string
}

function getStatus(error: any) {
  return error?.status || error?.response?.status || error?.data?.statusCode
}

export async function apiWithAuthRetry<T>(request: (headers: AuthHeaders) => Promise<T>) {
  const session = await auth()
  const accessToken = session?.user?.accessToken

  if (!session || !accessToken) {
    throw new Error("Unauthorized")
  }

  try {
    return await request({ Authorization: `Bearer ${accessToken}` })
  } catch (error: any) {
    const refreshToken = session.user.refreshToken

    if (getStatus(error) !== 401 || !refreshToken) {
      throw error
    }

    const refreshResponse = await api.post("/auth/refresh", { refreshToken })
    const refreshedAccessToken = refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken

    if (!refreshedAccessToken) {
      throw error
    }

    return await request({ Authorization: `Bearer ${refreshedAccessToken}` })
  }
}
