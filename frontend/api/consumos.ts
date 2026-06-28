import useSWR from "swr"

const EP = "/consumo"

export const useConsumos = (
    nodoId: any,
    refresh = 30000
) => {

    const {
        data,
        error,
        mutate: mutateConsumos
    } = useSWR(
        nodoId
            ? `${EP}/${nodoId}`
            : null,
        {
            refreshInterval: refresh,
            revalidateOnFocus: false
        }
    )

    return {
        consumos: data?.data,
        loading: !data && !error,
        error,
        mutateConsumos
    }
}