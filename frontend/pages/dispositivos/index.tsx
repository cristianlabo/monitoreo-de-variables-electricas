import React from "react"
import type { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from "next/router"

import { useDispositivoList } from "./../../api"
import { Layout } from "./../../Components"

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box
} from "@mui/material"

import ElectricalServicesIcon
from '@mui/icons-material/ElectricalServices'

import GitHubIcon
from '@mui/icons-material/GitHub'

import LinkedInIcon
from '@mui/icons-material/LinkedIn'

import InstagramIcon
from '@mui/icons-material/Instagram'

const Dispositivos: NextPage = () => {

  const router =
    useRouter();

  const { role } =
    router.query;

  const { dispositivos } =
    useDispositivoList();

  const onBack =
    () => {

      router.push(
        `/home?role=${role}`
      );

    }

  return (

    <Layout>

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >

        {/* CONTENIDO */}
        <Box sx={{ flex: 1 }}>

          {/* HEADER */}
          <Paper
            elevation={4}
            sx={{
              background: "#263238",
              color: "white",
              padding: "25px",
              marginBottom: "25px",
              borderRadius: "12px",
              textAlign: "center"
            }}
          >

            <ElectricalServicesIcon
              sx={{
                fontSize: 55,
                color: "#FFC107"
              }}
            />

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              DISPOSITIVOS ELÉCTRICOS
            </Typography>

            <Typography variant="body2">
              Visualización de mediciones
              eléctricas en tiempo real
            </Typography>

          </Paper>


          {/* BOTON VOLVER ARRIBA */}
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "flex-start"
            }}
          >
            <Button
              variant="contained"
              onClick={onBack}
              sx={{
                backgroundColor: "#455A64",

                '&:hover': {
                  backgroundColor: "#37474F"
                }
              }}
            >
              VOLVER
            </Button>
          </div>


          {/* TABLA */}
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              borderRadius: "15px",
              overflow: "hidden"
            }}
          >

            <Table>

              <TableHead>

                <TableRow
                  sx={{
                    backgroundColor: "#37474F"
                  }}
                >

                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    ID
                  </TableCell>

                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Nombre
                  </TableCell>

                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Ubicación
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Vrms
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Irms
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    P (W)
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Q (VAR)
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    S (VA)
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Cos φ
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold" }}
                  >
                    Acción
                  </TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {dispositivos?.map(
                  (
                    element: any,
                    index: number
                  ) => (

                    <TableRow
                      key={index}
                      hover
                      sx={{
                        transition: "0.2s",

                        '&:hover': {
                          backgroundColor: "#ECEFF1",
                          transform: "scale(1.002)"
                        }
                      }}
                    >

                      <TableCell>
                        {element.dispositivoId}
                      </TableCell>

                      <TableCell>
                        {element.nombre}
                      </TableCell>

                      <TableCell>
                        {element.ubicacion}
                      </TableCell>

                      <TableCell align="center">
                        {element.vrms} V
                      </TableCell>

                      <TableCell align="center">
                        {element.irms} A
                      </TableCell>

                      <TableCell align="center">
                        {element.potencia_activa} W
                      </TableCell>

                      <TableCell align="center">
                        {element.potencia_reactiva} VAR
                      </TableCell>

                      <TableCell align="center">
                        {element.potencia_aparente} VA
                      </TableCell>

                      <TableCell align="center">
                        {element.cos_phi}
                      </TableCell>

                      <TableCell align="center">

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                            flexWrap: "wrap"
                          }}
                        >

                          <Link
                            href={`/dispositivos/${element.dispositivoId}?role=${role}`}
                            passHref
                          >
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                backgroundColor: "#1976D2",
                                textTransform: "none",
                                borderRadius: "8px"
                              }}
                            >
                              Mediciones
                            </Button>
                          </Link>

                          <Link
                            href={`/consumos/${element.dispositivoId}?role=${role}`}
                            passHref
                          >
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                backgroundColor: "#388E3C",
                                textTransform: "none",
                                borderRadius: "8px"
                              }}
                            >
                              Consumos
                            </Button>
                          </Link>

                          <Link
                            href={`/alarmas/${element.dispositivoId}?role=${role}`}
                            passHref
                          >
                            <Button
                              variant="contained"
                              size="small"
                              sx={{
                                backgroundColor: "#EF6C00",
                                textTransform: "none",
                                borderRadius: "8px"
                              }}
                            >
                              Alarmas
                            </Button>
                          </Link>

                        </div>

                      </TableCell>

                    </TableRow>
                  )
                )}

              </TableBody>

            </Table>

          </TableContainer>


          {/* BOTON VOLVER ABAJO */}
          <div
            style={{
              marginTop: "20px",
              marginBottom: "30px",
              display: "flex",
              justifyContent: "flex-start"
            }}
          >
            <Button
              variant="contained"
              onClick={onBack}
              sx={{
                backgroundColor: "#455A64",

                '&:hover': {
                  backgroundColor: "#37474F"
                }
              }}
            >
              VOLVER
            </Button>
          </div>

        </Box>


        {/* FOOTER */}
        <Paper
          elevation={4}
          sx={{
            background: "#263238",
            color: "white",
            padding: "28px",
            textAlign: "center",
            borderRadius: "12px",
            mt: 2
          }}
        >

          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 1
            }}
          >
            SISTEMA IoT DE MONITOREO ELÉCTRICO
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: "#CFD8DC"
            }}
          >
            Plataforma para monitoreo
            de variables eléctricas
            en tiempo real
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 3
            }}
          >

            <Button
              variant="contained"
              startIcon={<GitHubIcon />}
              href="https://github.com/"
              target="_blank"
              sx={{
                backgroundColor: "#424242"
              }}
            >
              GitHub
            </Button>

            <Button
              variant="contained"
              startIcon={<LinkedInIcon />}
              href="https://linkedin.com/"
              target="_blank"
              sx={{
                backgroundColor: "#1565C0"
              }}
            >
              LinkedIn
            </Button>

            <Button
              variant="contained"
              startIcon={<InstagramIcon />}
              href="https://instagram.com/"
              target="_blank"
              sx={{
                backgroundColor: "#AD1457"
              }}
            >
              Instagram
            </Button>

          </Box>

          <Typography
            variant="body2"
            sx={{
              color: "#B0BEC5"
            }}
          >
            Proyecto Final - CeIoT
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "#90A4AE"
            }}
          >
            Ingeniería Electrónica • IoT • Monitoreo Energético
          </Typography>

        </Paper>

      </Box>

    </Layout>
  )
}

export default Dispositivos