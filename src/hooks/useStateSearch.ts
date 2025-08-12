'use client'
import axiosWrapper from '@/utils/api';
import { LOCATION_API } from '@/utils/apiUrl';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

import { useState } from 'react';
type State = {
  name: string;
  abbreviation: string;
  _id: string;
};

export const useStateSearch = () => {
  const [loading, setLoading] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);

  const searchStates = async (inputValue: string) => {
    setLoading(true);
    try {
        const response = (await axiosWrapper("get", LOCATION_API.GET_STATES, {}, token ?? undefined)) as {
          data: State[];
        };
      const data = response.data;
      return data.map((state: State) => ({
        value: state._id,
        label: state.name
        }));

    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { searchStates, loading };
};