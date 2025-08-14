import bcrypt from 'bcrypt'

const ROUNDS = 10

export const hashPassword = async (plain: string) => bcrypt.hash(plain, ROUNDS)
export const comparePassword = async (plain: string, hash: string) => bcrypt.compare(plain, hash)
