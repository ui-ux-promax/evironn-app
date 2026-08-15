import { axiosInstance } from './instance';
import type { CreateCartItemValues } from './dto/cart.dto';
import type { CartDto } from './dto/commerce-cart.dto';

export const getCart = async (): Promise<CartDto> => (await axiosInstance.get<CartDto>('/cart')).data;

export const addCartItem = async (values: CreateCartItemValues): Promise<CartDto> =>
  (await axiosInstance.post<CartDto>('/cart', values)).data;

export const updateItemQuantity = async (id: string, quantity: number): Promise<CartDto> =>
  (await axiosInstance.patch<CartDto>(`/cart/${id}`, { quantity })).data;

export const removeCartItem = async (id: string): Promise<CartDto> =>
  (await axiosInstance.delete<CartDto>(`/cart/${id}`)).data;

export const clearCart = async (): Promise<CartDto> => (await axiosInstance.delete<CartDto>('/cart')).data;
