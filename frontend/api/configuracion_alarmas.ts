import { ApiInstnace } from "./../utils"
import useSWR from "swr"

const EP =
    "/configuracion-alarmas"


/* ==========================
   OBTENER TODAS
========================== */
export const useConfiguracionAlarmasList =
    () => {

        const {
            data,
            mutate:
                mutateConfiguracionAlarmas
        } =
            useSWR(
                `${EP}/`
            );

        const configuracionAlarmas =
            data?.data || [];

        return {
            configuracionAlarmas,
            mutateConfiguracionAlarmas
        };

    };


/* ==========================
   OBTENER POR DISPOSITIVO ID
========================== */
export const useConfiguracionAlarmasById =
    (
        dispositivoId: any
    ) => {

        const {
            data,
            mutate:
                mutateConfiguracionAlarma
        } =
            useSWR(

                dispositivoId
                    ? `${EP}/${dispositivoId}`
                    : null

            );

        const configuracionAlarma =
            data?.data || null;

        return {
            configuracionAlarma,
            mutateConfiguracionAlarma
        };

    };


/* ==========================
   CREAR CONFIGURACIÓN
========================== */
export const
createConfiguracionAlarma =
    async (
        body: any
    ) => {

        const {
            data
        } =
            await ApiInstnace.post(

                EP,

                body

            );

        return data;

    };


/* ==========================
   ACTUALIZAR CONFIGURACIÓN
========================== */
export const
updateConfiguracionAlarma =
    async (
        configuracionAlarmaId:
            string | number,

        body: any
    ) => {

        const {
            data
        } =
            await ApiInstnace.put(

                `${EP}/${configuracionAlarmaId}`,

                body

            );

        return data;

    };


/* ==========================
   ELIMINAR CONFIGURACIÓN
========================== */
export const
deleteConfiguracionAlarma =
    async (
        configuracionAlarmaId:
            string | number
    ) => {

        const {
            data
        } =
            await ApiInstnace.delete(

                `${EP}/${configuracionAlarmaId}`

            );

        return data;

    };