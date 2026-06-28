import { ApiInstnace } from "./../utils"
import useSWR from "swr"

const EP = "/alarmas"

// ============================
// OBTENER TODAS LAS ALARMAS
// ============================
export const useAlarmasList = () => {

    const {
        data,
        mutate: mutateAlarmas
    } = useSWR(
        `${EP}/`
    );

    const alarmas =
        data?.data;

    return {
        alarmas,
        mutateAlarmas
    }
}

// ============================
// OBTENER ALARMAS POR ID
// ============================
export const useAlarmasById = (
    dispositivoId: any
) => {

    const {
        data,
        mutate: mutateAlarma
    } = useSWR(
        `${EP}/${dispositivoId}`
    );

    const alarmas =
        data?.data;

    return {
        alarmas,
        mutateAlarma
    }
}

// ============================
// RESOLVER ALARMA
// ============================
export const resolverAlarma =
    async (
        alarmaId: number
    ) => {

    try {

        const response =
            await ApiInstnace.patch(
                `${EP}/${alarmaId}/resolver`
            );

        return response.data;

    } catch (error: any) {

        console.log(
            "ERROR RESOLVIENDO ALARMA",
            error
        );

        throw error;
    }
}