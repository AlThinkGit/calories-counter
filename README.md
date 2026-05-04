# AI Calorie Counter

**AI Calorie Counter** es una aplicación web que actúa como nutricionista personal impulsado por inteligencia artificial. Su propósito es ayudar a las personas a llevar un control alimenticio preciso y accesible, sin necesidad de conocimientos en nutrición.

## ¿Qué hace?

El usuario puede tomar una foto o subir una imagen de su comida y la aplicación, usando el modelo **Gemini** de Google, identifica automáticamente los alimentos presentes en la imagen, estima las calorías de cada uno y calcula el total de la comida. Cada alimento detectado se presenta con su nombre, tamaño de porción, cantidad y calorías estimadas por unidad.

## Características principales

- **Análisis de imágenes con IA** — detecta alimentos y estima calorías a partir de una foto tomada con la cámara del dispositivo o subida desde la galería.
- **Cámara en tiempo real** — permite capturar la comida directamente desde el navegador sin salir de la aplicación.
- **Desglose detallado** — muestra cada alimento identificado con cantidad, tamaño de porción y calorías individuales.
- **Cuentas de usuario** — sistema de autenticación con Firebase para que cada persona gestione su propio historial y objetivos calóricos.
- **Soporte multilenguaje** — la interfaz está preparada para múltiples idiomas.
- **Diseño responsive** — funciona tanto en escritorio como en dispositivos móviles.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript |
| Bundler | Vite 6 |
| Estilos | Tailwind CSS 4 |
| IA | Google Gemini (gemini-2.5-pro) |
| Backend / Auth | Firebase |
| Routing | React Router v7 |
| Contenedores | Docker + Nginx |

## Público objetivo

Personas que buscan hacer un cambio físico, como quienes asisten al gimnasio o siguen una dieta, y que necesitan un registro calórico rápido sin tener que buscar manualmente cada alimento en una base de datos.
