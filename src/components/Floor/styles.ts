import { StyleSheet } from 'react-native'

export const styles = ({ xBody, yBody, widthBody, heightBody, color }: { xBody: number, yBody: number, widthBody: number, heightBody: number, color: string }) =>
  StyleSheet.create({
    floor: {
      position: 'absolute',
      left: xBody,
      top: yBody,
      width: widthBody,
      height: heightBody,
      backgroundColor: color
    }
  })
