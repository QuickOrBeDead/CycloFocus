import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  }
})

let errorCallback: ((message: string) => void) | null = null

export const setErrorCallback = (callback: (message: string) => void) => {
  errorCallback = callback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = "An unexpected error occurred. Please try again."

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>

      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status
        const data = axiosError.response.data

        if (status === 400) {
          errorMessage = data?.message || "Invalid request. Please check your input."
        } else if (status === 401) {
          errorMessage = "Unauthorized. Please log in again."
        } else if (status === 403) {
          errorMessage = "You don't have permission to perform this action."
        } else if (status === 404) {
          errorMessage = "The requested resource was not found."
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later."
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later."
        } else {
          errorMessage = data?.message || `Error: ${status}`
        }
      } else if (axiosError.request) {
        // Request made but no response
        errorMessage = "No response from server. Check your connection."
      } else {
        errorMessage = axiosError.message || "Failed to make request."
      }
    }

    console.error("API Error:", error)
    
    // Call the registered error callback if available
    if (errorCallback) {
      errorCallback(errorMessage)
    }

    return Promise.reject(error)
  }
)
