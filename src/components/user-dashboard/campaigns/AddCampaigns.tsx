'use client'

import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import { FieldAttributes } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useEffect, useState, useCallback } from 'react';

import axiosWrapper from '@/utils/api';
import { CAMPAIGNS_API, LOCATION_API } from '@/utils/apiUrl';

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { LEAD_TYPE, EXCLUSIVITY, STATUS, DAYS_OF_WEEK, LANGUAGE } from '@/constants/enums';

import CustomFormikAsyncSelect from '@/components/form/CustomFormikAsyncSelect';
import { FormikInput, FormikSelect, FormikCheckbox, FormikRadio, FormikTextarea } from '@/components/form';

interface DaySchedule {
  day: typeof DAYS_OF_WEEK[number];
  active: boolean;
  start_time: string;
  end_time: string;
  cap: number;
}

type State = {
  name: string;
  abbreviation: string;
  _id: string;
};

type County = {
  name: string;
  _id: string;
};

interface StateOption {
  value: string;
  label: string;
  name: string;
  abbreviation: string;
}

interface CountyOption {
  value: string;
  label: string;
}

const AddNewCampaign = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [activeTab, setActiveTab] = useState('basic');
  const [statesList, setStatesList] = useState<State[]>([]);
  const [countiesList, setCountiesList] = useState<County[]>([]);
  const [isLoadingCounties, setIsLoadingCounties] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axiosWrapper('get', LOCATION_API.GET_STATES, {}, token ?? undefined) as { data: State[] };
        if (response?.data) {
          setStatesList(response.data);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
        toast.error('Could not load state list');
      }
    };

    fetchStates();
  }, [token]);

  const loadStates = (inputValue: string, callback: (options: StateOption[]) => void) => {
    const filteredOptions = statesList
      .filter((state) =>
        state.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        state.abbreviation.toLowerCase().includes(inputValue.toLowerCase())
      )
      .map((state) => ({
        label: `${state.name} (${state.abbreviation})`,
        value: state._id,
        name: state.name,
        abbreviation: state.abbreviation
      }));

    callback(filteredOptions);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'geography', label: 'Geography', icon: '🌍' },
    { id: 'utilities', label: 'Utilities', icon: '⚡' },
    { id: 'delivery', label: 'Delivery', icon: '📧' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ];

  const initialValues = {
    name: '',
    status: 'ACTIVE' as keyof typeof STATUS,
    lead_type: 'SOLAR_RESIDENTIAL' as keyof typeof LEAD_TYPE,
    exclusivity: 'EXCLUSIVE' as keyof typeof EXCLUSIVITY,
    bid_price: 0,
    language: 'en',
    geography: {
      state: null as StateOption | null,
      coverage: {
        type: 'FULL_STATE' as 'FULL_STATE' | 'PARTIAL',
        partial: {
          counties: [] as CountyOption[],
          radius: '',
          zipcode: '',
          zip_codes: '',
          countries: ['US'],
        },
      },
    },
    utilities: {
      include_all: false,
      include_some: [''],
      exclude_some: [''],
    },
    delivery: {
      method: 'email',
      schedule: {
        days: DAYS_OF_WEEK.map((day) => ({
          day,
          active: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day),
          start_time: '09:00',
          end_time: day === 'FRIDAY' ? '16:00' : '17:00',
          cap: day === 'WEDNESDAY' ? 15 : day === 'FRIDAY' ? 8 : ['TUESDAY', 'THURSDAY'].includes(day) ? 12 : day === 'MONDAY' ? 10 : 5,
        })) as DaySchedule[],
      },
      other: {
        homeowner: true,
        second_pro_call_request: false,
      },
    },
    note: '',
  };

  // Updated validation schema - only required fields
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Campaign name is required'),
    status: Yup.string().oneOf(Object.values(STATUS)).required('Status is required'),
    lead_type: Yup.string().oneOf(Object.values(LEAD_TYPE)).required('Lead type is required'),
    exclusivity: Yup.string().oneOf(Object.values(EXCLUSIVITY)).required('Exclusivity is required'),
    bid_price: Yup.number().min(0, 'Bid price must be positive').required('Bid price is required'),
    language: Yup.string().required('Language is required'),
    geography: Yup.object().shape({
      state: Yup.mixed()
        .test('is-object', 'State is required', (value) => value !== null)
        .required('State is required'),
      coverage: Yup.object().shape({
        type: Yup.string().oneOf(['FULL_STATE', 'PARTIAL']).required('Coverage type is required'),
        // Partial fields are optional
        partial: Yup.object().shape({
          counties: Yup.array(),
          radius: Yup.string(),
          zipcode: Yup.string()
            .matches(/^\d{5}$/, 'ZIP code must be exactly 5 digits'),
          zip_codes: Yup.string()
            .matches(/^(\d{5})(\|\d{5})*$/, 'ZIPs must be 5-digit numbers separated by "|"'),
          countries: Yup.array().of(Yup.string()),
        }),
      }),
    }),
    // All other fields are optional
    utilities: Yup.object().shape({
      include_all: Yup.boolean(),
      include_some: Yup.array().of(Yup.string()),
      exclude_some: Yup.array().of(Yup.string()),
    }),
    delivery: Yup.object(),
    note: Yup.string(),
  });

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    try {
      setSubmitting(true);

      const cleanedValues = {
        ...values,
        geography: {
          ...values.geography,
          state: values.geography.state ? values.geography.state.value : '',
          coverage: {
            ...values.geography.coverage,
            partial: {
              ...values.geography.coverage.partial,
              counties: values.geography.coverage.partial.counties.map(c => c.value),
              radius: values.geography.coverage.partial.radius ? Number(values.geography.coverage.partial.radius) : 0,
              zipcode: values.geography.coverage.partial.zipcode || '',
              zip_codes: values.geography.coverage.partial.zip_codes ? 
                values.geography.coverage.partial.zip_codes.split('|').filter(code => code.trim() !== '') : [],
            },
          },
        },
        utilities: {
          ...values.utilities,
          include_some: values.utilities.include_some.filter((util) => util.trim() !== ''),
          exclude_some: values.utilities.exclude_some.filter((util) => util.trim() !== ''),
        },
      };

      console.log('Cleaned Values:', cleanedValues);
      
      // Remove this return false when ready to submit
      // return false;
      
      const response = await axiosWrapper('post', CAMPAIGNS_API.CREATE_CAMPAIGN, cleanedValues, token ?? undefined) as {
        message?: string;
      };
      toast.success(response?.message || 'Campaign added successfully!');
      resetForm();
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error('Failed to save campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTabContent = (values: typeof initialValues) => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput name="name" placeholder="Campaign Name" label="Campaign Name *" />
              <FormikSelect
                name="status"
                label="Status *"
                options={Object.entries(STATUS).map(([key, value]) => ({ value, label: key.replace('_', ' ') }))}
              />
              <FormikSelect
                name="lead_type"
                label="Lead Type *"
                options={Object.entries(LEAD_TYPE).map(([key, value]) => ({ value, label: key.replace('_', ' ') }))}
              />
              <FormikSelect
                name="exclusivity"
                label="Exclusivity *"
                options={Object.entries(EXCLUSIVITY).map(([key, value]) => ({ value, label: key.replace('_', ' ') }))}
              />
              <FormikInput name="bid_price" min="0" type="number" placeholder="0" label="Bid Price ($) *" />
              <FormikSelect
                name="language"
                label="Language *"
                options={Object.entries(LANGUAGE).map(([key, value]) => ({ value, label: key.replace('_', ' ') }))}
              />
            </div>
          </div>
        );

      case 'geography':
        const loadCounties = (inputValue: string, callback: (options: CountyOption[]) => void) => {
          const filtered = countiesList
            .filter(county => county.name.toLowerCase().includes(inputValue.toLowerCase()))
            .map(county => ({ label: county.name, value: county._id }));
          callback(filtered);
        };

        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Geography Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomFormikAsyncSelect
                name="geography.state"
                label="State *"
                loadOptions={loadStates}
                placeholder="Search and select a state"
              />
              <div>
                <label className="block text-[#1C1C1C] text-lg mb-2">Coverage *</label>
                <div className="flex items-center space-x-6">
                  <FormikRadio name="geography.coverage.type" value="FULL_STATE" label="Full State" />
                  <FormikRadio name="geography.coverage.type" value="PARTIAL" label="Partial" />
                </div>
                <ErrorMessage name="geography.coverage.type" component="div" className="text-red-500 text-xs mt-1" />
              </div>
            </div>

            {values.geography.coverage.type === 'PARTIAL' && (
              <>
                <p className='text-center text-[#666666] text-sm italic'>
                  Please enter a Radius & Zip, a list of Zip codes, a selection of Counties, or any combination of these
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormikInput 
                    name="geography.coverage.partial.radius" 
                    type="number" 
                    placeholder="25" 
                    label="Radius (miles)" 
                  />
                  <FormikInput 
                    name="geography.coverage.partial.zipcode" 
                    type="text" 
                    placeholder="90210" 
                    label="Center Zip Code" 
                  />

                  {isLoadingCounties ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Loading counties...</span>
                    </div>
                  ) : (
                    <div className="w-full">
                      <CustomFormikAsyncSelect
                        isMulti
                        name="geography.coverage.partial.counties"
                        label="Counties"
                        loadOptions={loadCounties}
                        placeholder="Search and select counties"
                      />
                    </div>
                  )}

                  {/* <div className="col-span-1 md:col-span-2"> */}
                    <FormikTextarea
                      name="geography.coverage.partial.zip_codes"
                      label="ZIP Codes (separated by |)"
                      placeholder="#####|#####|#####..."
                      rows={3}
                    />
                  {/* </div> */}
                </div>
              </>  
            )}
          </div>
        );

      case 'utilities':
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Utility Settings</h3>
            <FormikCheckbox name="utilities.include_all" label="Include All Utilities" />

            {!values.utilities.include_all && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[#1C1C1C] text-lg mb-2">Include Some Utilities</label>
                  <FieldArray name="utilities.include_some">
                    {({ push, remove }) => (
                      <div className="space-y-2">
                        {values.utilities.include_some.map((_, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <FormikInput name={`utilities.include_some.${index}`} placeholder="Pacific Gas & Electric" />
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => push('')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Add Utility
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>

                <div>
                  <label className="block text-[#1C1C1C] text-lg mb-2">Exclude Some Utilities</label>
                  <FieldArray name="utilities.exclude_some">
                    {({ push, remove }) => (
                      <div className="space-y-2">
                        {values.utilities.exclude_some.map((_, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <FormikInput
                              name={`utilities.exclude_some.${index}`}
                              placeholder="Los Angeles Department of Water and Power"
                            />
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => push('')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Add Excluded Utility
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              </div>
            )}
          </div>
        );

      case 'delivery':
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Delivery Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikSelect
                name="delivery.method"
                label="Delivery Method"
                options={[
                  { value: 'email', label: 'Email' },
                  { value: 'api', label: 'API' },
                  { value: 'phone', label: 'Phone' },
                ]}
              />
              <div></div>
              <FormikCheckbox name="delivery.other.homeowner" label="Homeowner" />
              <FormikCheckbox name="delivery.other.second_pro_call_request" label="Second Pro Call Request" />
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Weekly Schedule</h3>
            <div className="space-y-4">
              {values.delivery.schedule.days.map((day, index) => (
                <div key={day.day} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 border border-[#E0E0E0] rounded-lg">
                  <div className="font-medium text-[#1C1C1C]">{day.day}</div>
                  <FormikCheckbox name={`delivery.schedule.days.${index}.active`} label="Active" />
                  <FormikInput name={`delivery.schedule.days.${index}.start_time`} type="time" label="Start" />
                  <FormikInput name={`delivery.schedule.days.${index}.end_time`} type="time" label="End" />
                  <FormikInput name={`delivery.schedule.days.${index}.cap`} type="number" label="Cap" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <h3 className="text-[20px] font-[500] text-[#1C1C1C] mb-4">Campaign Notes</h3>
            <Field
              name="note"
              as="textarea"
              rows={8}
              placeholder="High-quality solar leads for residential customers in premium California zip codes"
              className="w-full border border-[#E0E0E0] rounded-[8px] px-5 py-3 text-[16px] font-inter bg-[#FFFFFF] text-[#333333] focus:border-[#000] outline-none transition resize-vertical"
            />
            <ErrorMessage name="note" component="div" className="text-red-500 text-xs mt-1" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container min-h-screen flex flex-col mx-auto items-center md:px-0 py-8">
      <h2 className="text-[24px] font-[500] text-[#1C1C1C] text-center mb-6">Add New Campaign</h2>

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, values, setFieldValue }) => {
          // Fetch counties when state or coverage type changes
          useEffect(() => {
            const fetchCounties = async () => {
              if (values.geography.state && values.geography.coverage.type === 'PARTIAL') {
                setIsLoadingCounties(true);
                setFieldValue('geography.coverage.partial.counties', []);

                try {
                  const stateId = values.geography.state.value;
                  const url = LOCATION_API.GET_COUNTIES_BY_STATE.replace(':stateId', stateId as string);
                  const response = await axiosWrapper(
                    'get', 
                    url, 
                    {}, 
                    token ?? undefined
                  ) as { data: County[] };
                  
                  setCountiesList(response.data);
                } catch (err) {
                  console.error('Failed to load counties:', err);
                  toast.error('Could not load county list');
                } finally {
                  setIsLoadingCounties(false);
                }
              } else {
                setCountiesList([]);
              }
            };

            fetchCounties();
          }, [values.geography.state, values.geography.coverage.type, token, setFieldValue]);

          return (
            <div className="w-full max-w-[1200px]">
              {/* Tab Navigation */}
              <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 p-2 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 cursor-pointer rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.id ? 'bg-[#1C1C1C] text-white shadow-lg' : 'bg-white text-[#1C1C1C] hover:bg-gray-100 border border-[#E0E0E0]'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <Form className="space-y-8">
                {/* Tab Content */}
                <div className="bg-white p-8 rounded-lg border border-[#E0E0E0] min-h-[500px]">{renderTabContent(values)}</div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1].id);
                      }
                    }}
                    className={`px-6 py-3 rounded-lg border transition ${
                      tabs.findIndex((tab) => tab.id === activeTab) === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-[#1C1C1C] border-[#E0E0E0] hover:bg-gray-50 cursor-pointer'
                    }`}
                    disabled={tabs.findIndex((tab) => tab.id === activeTab) === 0}
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-4">
                    {tabs.findIndex((tab) => tab.id === activeTab) < tabs.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
                          if (currentIndex < tabs.length - 1) {
                            setActiveTab(tabs[currentIndex + 1].id);
                          }
                        }}
                        className="px-6 py-3 bg-[#1C1C1C] cursor-pointer text-white rounded-lg hover:bg-[#333333] transition"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-8 py-3 bg-[#1C1C1C] text-white text-[18px] font-semibold rounded-lg border-none cursor-pointer transition hover:bg-[#333333]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
                      </button>
                    )}
                  </div>
                </div>
              </Form>
            </div>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddNewCampaign;