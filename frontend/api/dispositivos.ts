import useSWR from "swr"

const EP = "/dispositivos"

const swrConfig = {
    refreshInterval: 3000,
    revalidateOnFocus: true
}


// obtener todos los dispositivos
export const useDispositivoList = () => {

    const { data, mutate: mutateDispositivos } =
        useSWR(EP, swrConfig)

    return {
        dispositivos: data?.data,
        mutateDispositivos
    }
}


// obtener un dispositivo único
export const useDispositivoById = (id: any) => {

    const { data, mutate: mutateDispositivo } =
        useSWR(`${EP}/${id}`, swrConfig)

    return {
        dispositivo: data?.data,
        mutateDispositivo
    }
}


// obtener todos los logs
export const useLogsList = () => {

    const { data, mutate: mutateLogs } =
        useSWR("/logs/", swrConfig)

    return {
        logs: data?.data,
        mutateLogs
    }
}


// obtener logs por dispositivo
export const useLogsById = (
    dispositivoId: any
) => {

    const { data, mutate: mutateLogs } =
        useSWR(
            `/logs/${dispositivoId}`,
            swrConfig
        )

    return {
        logs: data?.data,
        mutateLogs
    }
}

// obtener logs paginados
export const useLogsPaginado = (
    dispositivoId: any,
    page: number = 1,
    limit: number = 1440,
    sortBy: string = 'ts',
    sortOrder: string = 'desc'
) => {

    const query = dispositivoId
        ? `/logs/paginar?nodoId=${dispositivoId}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
        : `/logs/paginar?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`

    const { data, mutate: mutateLogs } =
        useSWR(
            dispositivoId ? query : null,
            swrConfig
        )

    return {
        items: data?.data?.items || [],
        page: data?.data?.page || 1,
        limit: data?.data?.limit || 1440,
        total: data?.data?.total || 0,
        totalPages: data?.data?.totalPages || 1,
        mutateLogs
    }
}