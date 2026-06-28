import React, { useState } from "react"
import type { NextPage } from "next"
import { useRouter } from "next/router"

import { useUserByUsername } from "../api"

import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from "@mui/material"

import BoltIcon
from "@mui/icons-material/Bolt"

const Login: NextPage = () => {

  const router =
    useRouter()

  const [username,
    setUsername] =
    useState("")

  const [password,
    setPassword] =
    useState("")

  const [errorMessage,
    setErrorMessage] =
    useState("")

  const { user } =
    useUserByUsername(
      username
    )

  const handleLogin = () => {

    setErrorMessage("")


    // validar campos vacíos
    if (
      !username ||
      !password
    ) {

      setErrorMessage(
        "Ingrese usuario y contraseña."
      )

      return
    }


    // usuario inexistente
    if (!user) {

      setErrorMessage(
        "Acceso denegado. Verifique las credenciales."
      )

      return
    }


    // usuario deshabilitado
    if (!user.enabled) {

      setErrorMessage(
        "Usuario deshabilitado."
      )

      return
    }


    // password incorrecta
    if (
      user.password !==
      password
    ) {

      setErrorMessage(
        "Acceso denegado. Verifique las credenciales."
      )

      return
    }


    // LOGIN OK
    router.push({
      pathname: "/home",

      query: {
        username:
          user.username,

        role:
          user.role
      }
    })
  }

  return (

    <Box
      sx={{
        minHeight:
          "100vh",

        backgroundColor:
          "#ECEFF1",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        padding: 2
      }}
    >

      <Paper
        elevation={6}
        sx={{
          width: 420,
          borderRadius:
            "18px",

          overflow:
            "hidden"
        }}
      >

        {/* HEADER */}
        <Box
          sx={{
            background:
              "#263238",

            color:
              "white",

            textAlign:
              "center",

            padding:
              "35px"
          }}
        >

          <BoltIcon
            sx={{
              fontSize: 70,
              color:
                "#FFC107"
            }}
          />

          <Typography
            variant="h4"
            fontWeight="bold"
            mt={1}
          >
            SISTEMA IoT
          </Typography>

          <Typography
            variant="body2"
          >
            Monitoreo eléctrico inteligente
          </Typography>

        </Box>


        {/* FORM */}
        <Box
          sx={{
            padding: 4
          }}
        >

          <Typography
            variant="h6"
            textAlign="center"
            mb={3}
            fontWeight="bold"
          >
            INICIAR SESIÓN
          </Typography>


          {errorMessage && (

            <Alert
              severity="error"
              sx={{
                mb: 2
              }}
            >
              {errorMessage}
            </Alert>

          )}


          <TextField
            fullWidth
            label="Usuario"
            margin="normal"
            value={
              username
            }

            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />


          <TextField
            fullWidth
            type="password"
            label="Contraseña"
            margin="normal"
            value={
              password
            }

            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }

            onKeyDown={(e) => {

              if (
                e.key ===
                "Enter"
              ) {

                handleLogin()
              }

            }}
          />


          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={
              handleLogin
            }

            sx={{
              marginTop: 3,

              backgroundColor:
                "#263238",

              padding:
                "12px",

              '&:hover': {
                backgroundColor:
                  "#37474F"
              }
            }}
          >
            INGRESAR
          </Button>

        </Box>

      </Paper>

    </Box>
  )
}

export default Login