// Auth Controller
// Handler untuk register, login, logout, get user

import { Request, Response } from "express";
import * as authService from "../services/authService";

export async function register(req: Request, res: Response) {
  await authService.register(req, res);
}

export async function login(req: Request, res: Response) {
  await authService.login(req, res);
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req, res);
}

export async function getUser(req: Request, res: Response) {
  await authService.getUser(req, res);
}
