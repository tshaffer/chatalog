// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { chatalogApi } from '../features/api/chatalogApi';

export const store = configureStore({
  reducer: {
    [chatalogApi.reducerPath]: chatalogApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(chatalogApi.middleware),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
