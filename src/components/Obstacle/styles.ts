import { StyleSheet } from 'react-native'

export const styles = ({ xBody, yBody, widthBody, heightBody }: { xBody: number, yBody: number, widthBody: number, heightBody: number }) =>
  StyleSheet.create({
    obstacle: {
      position: 'absolute',
      left: xBody,
      top: yBody,
      width: widthBody,
      height: heightBody,
      resizeMode: 'cover'
    }
  })
