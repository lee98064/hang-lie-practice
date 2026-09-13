import type { KeyDefinition } from '../types'

export const ARRAY_KEYS: KeyDefinition[] = [
  { key: 'q', coordinate: '1上', roots: ['言', '工', '上', '七'], row: 'upper' },
  { key: 'w', coordinate: '2上', roots: ['女', '巛', '糹'], row: 'upper' },
  { key: 'e', coordinate: '3上', roots: ['門', '止', '耳', '臣'], row: 'upper' },
  { key: 'r', coordinate: '4上', roots: ['艹', '土', '士', '廿'], row: 'upper' },
  { key: 't', coordinate: '5上', roots: ['弓', '巴', '尸', '阝'], row: 'upper' },
  { key: 'y', coordinate: '6上', roots: ['言', '立', '走', '辶'], row: 'upper' },
  { key: 'u', coordinate: '7上', roots: ['月', '皿', '魚'], row: 'upper' },
  { key: 'i', coordinate: '8上', roots: ['金', '八', '羊'], row: 'upper' },
  { key: 'o', coordinate: '9上', roots: ['彳', '臼', '手', '斤'], row: 'upper' },
  { key: 'p', coordinate: '0上', roots: ['日', '曰', '田'], row: 'upper' },
  { key: 'a', coordinate: '1中', roots: ['一'], row: 'middle' },
  { key: 's', coordinate: '2中', roots: ['乙', '乚', '几'], row: 'middle' },
  { key: 'd', coordinate: '3中', roots: ['丨'], row: 'middle' },
  { key: 'f', coordinate: '4中', roots: ['十'], row: 'middle' },
  { key: 'g', coordinate: '5中', roots: ['石', '戶', '馬'], row: 'middle' },
  { key: 'h', coordinate: '6中', roots: ['丶', '方', '广'], row: 'middle' },
  { key: 'j', coordinate: '7中', roots: ['刀', '角', '目'], row: 'middle' },
  { key: 'k', coordinate: '8中', roots: ['八', '人'], row: 'middle' },
  { key: 'l', coordinate: '9中', roots: ['丿', '竹'], row: 'middle' },
  { key: ';', coordinate: '0中', roots: ['口'], row: 'middle' },
  { key: 'z', coordinate: '1下', roots: ['不', '大', '夫', '雨'], row: 'lower' },
  { key: 'x', coordinate: '2下', roots: ['風', '幺', '糸', '弋'], row: 'lower' },
  { key: 'c', coordinate: '3下', roots: ['卜', '小', '水'], row: 'lower' },
  { key: 'v', coordinate: '4下', roots: ['木'], row: 'lower' },
  { key: 'b', coordinate: '5下', roots: ['目', '又', '力'], row: 'lower' },
  { key: 'n', coordinate: '6下', roots: ['心', '宀', '之'], row: 'lower' },
  { key: 'm', coordinate: '7下', roots: ['夕', '貝'], row: 'lower' },
  { key: ',', coordinate: '8下', roots: ['火', '米'], row: 'lower' },
  { key: '.', coordinate: '9下', roots: ['行', '糸', '身'], row: 'lower' },
  { key: '/', coordinate: '0下', roots: ['虫', '四'], row: 'lower' },
]

export const KEY_LOOKUP = new Map(ARRAY_KEYS.map((definition) => [definition.key, definition]))

export const VALID_CODE_KEYS = new Set([...ARRAY_KEYS.map(({ key }) => key), ...'1234567890'])

export function codeToCoordinates(code: string): string[] {
  return [...code].map((key) => KEY_LOOKUP.get(key)?.coordinate ?? `候選 ${key}`)
}
