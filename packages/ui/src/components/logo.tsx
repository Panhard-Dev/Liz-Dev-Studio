import { ComponentProps } from "solid-js"
import crownUrl from "../assets/images/liz-crown-transparent.png"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 120 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image href={crownUrl} x="0" y="0" width="120" height="84" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 180 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image href={crownUrl} x="0" y="0" width="180" height="124" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 86"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <image href={crownUrl} x="0" y="15" width="95" height="64" preserveAspectRatio="xMidYMid meet" />
      <text
        x="118"
        y="58"
        fill="#e8e0ff"
        font-family="Arial, Helvetica, sans-serif"
        font-size="44"
        font-weight="800"
        letter-spacing="0"
      >
        Liz AI Brasil
      </text>
    </svg>
  )
}
