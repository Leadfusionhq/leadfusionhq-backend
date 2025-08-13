'use client'
import { useState, useEffect, useCallback } from 'react';
import axiosWrapper from '@/utils/api';
import { LOCATION_API } from '@/utils/apiUrl';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { County, CountyOption } from '@/types/campaign';

export const useCountySearch = (stateId: string | null) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCounties = useCallback(async (inputValue: string) => {
    if (!stateId) return [];
    
    try {
      setLoading(true);
      
      const url = LOCATION_API.GET_COUNTIES_BY_STATE.replace(":stateId", stateId as string);
      
      const response = (await axiosWrapper("get", url, {}, token ?? undefined)) as { data: County[] };
      return response.data.map((county: County) => ({
        value: county._id,
        label: county.name
      }));
    } catch (error) {
      console.error('County search failed:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [stateId, token]);

  useEffect(() => {
    if (stateId) {
      searchCounties('');
    }
  }, [stateId, searchCounties]);

  return { counties, loading, searchCounties };
};