import useSWR from "swr"
import { ApiInstnace, apiInstanceFetcher } from "../utils/axios"

const EP = "/users"


/* ==========================
   OBTENER TODOS
========================== */
export const useUsersList = () => {

    const {
        data,
        mutate: mutateUsers
    } = useSWR(
        EP,
        apiInstanceFetcher
    )

    const usuarios =
        data?.data || []

    return {
        usuarios,
        mutateUsers
    }

}


/* ==========================
   OBTENER POR USERNAME
========================== */
export const useUserByUsername = (
    username: any
) => {

    const {
        data,
        mutate: mutateUser
    } = useSWR(
        username
            ? `${EP}/${username}`
            : null,
        apiInstanceFetcher
    )

    const user =
        data?.data || null

    return {
        user,
        mutateUser
    }

}


/* ==========================
   CREAR USUARIO
========================== */
export const createUser =
    async (
        body: any
    ) => {

        try {
            const response =
                await ApiInstnace.post(
                    EP,
                    body
                )

            return response.data

        } catch (error: any) {
            console.error("Error creando usuario:", error.response?.data || error.message)
            throw error
        }

    }


/* ==========================
   ACTUALIZAR USUARIO
========================== */
export const updateUser =
    async (
        username: string,
        body: any
    ) => {

        try {
            const response =
                await ApiInstnace.put(
                    `${EP}/${username}`,
                    body
                )

            return response.data

        } catch (error: any) {
            console.error("Error actualizando usuario:", error.response?.data || error.message)
            throw error
        }

    }


/* ==========================
   ELIMINAR USUARIO
========================== */
export const deleteUser =
    async (
        username: string
    ) => {

        try {
            const response =
                await ApiInstnace.delete(
                    `${EP}/${username}`
                )

            return response.data

        } catch (error: any) {
            console.error("Error eliminando usuario:", error.response?.data || error.message)
            throw error
        }

    }