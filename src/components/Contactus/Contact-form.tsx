import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ContactForm = () => {
  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('Required'),
    lastName: Yup.string().required('Required'),
    phone: Yup.string(),
    email: Yup.string().email('Invalid email').required('Required'),
    subject: Yup.string().required('Required'),
    message: Yup.string().required('Required'),
    consent: Yup.boolean().oneOf([true], 'You must accept the disclaimer'),
  });
  return (
    <section className="md:pb-28 pb-12 px-8 bg-white text-center">
      {/* Section Heading */}
      <div className='contact-form-heading mb-10'>
      <h2 className="font-inter font-bold md:text-[50px] text-[28px] leading-[100%] tracking-[0] text-center align-middle mb-3">
      Get in Touch
      </h2>
      <p className='max-w-[577px] mx-auto mb-3 md:text-[16px] text-[14px] text-[#1C1C1C]'>Whether it’s about Lead Fusion HQ, our tools, or support — we’re here to help you every step of the way</p>


      </div>

    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        subject: '',
        message: '',
        consent: false,
      }}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        console.log('Form submitted:', values);
      }}
    >
      {() => (
        <Form className="max-w-4xl mx-auto space-y-6">

          {/* Row 1: First and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Field
                name="firstName"
                placeholder="First Name*"
                className="border border-[#0101011A] py-[15px] px-[15px] md:py-[25px] md:px-[20px] rounded-md w-full text-sm placeholder-[#838383]"
              />
              <ErrorMessage name="firstName" component="div" className="text-red-500 text-start text-xs mt-1" />
            </div>
            <div>
              <Field
                name="lastName"
                placeholder="Last Name*"
                className="border border-[#0101011A] py-[15px] px-[15px] md:py-[25px] md:px-[20px] rounded-md w-full text-sm placeholder-[#838383]"
              />
              <ErrorMessage name="lastName" component="div" className="text-red-500 text-start text-xs mt-1" />
            </div>
          </div>

          {/* Row 2: Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Field
                name="phone"
                placeholder="Phone Number"
                className="border border-[#0101011A] py-[15px] px-[15px] md:py-[25px] md:px-[20px] rounded-md w-full text-sm placeholder-[#838383]"
              />
            </div>
            <div>
              <Field
                name="email"
                type="email"
                placeholder="Email Address*"
                className="border border-[#0101011A] py-[15px] px-[15px] md:py-[25px] md:px-[20px] rounded-md w-full text-sm placeholder-[#838383]"
              />
              <ErrorMessage name="email" component="div" className="text-red-500 text-start text-xs mt-1" />
            </div>
          </div>

          {/* Subject */}
          <div>
            <Field
              name="subject"
              placeholder="Subject*"
              className="border border-[#0101011A] py-[15px] px-[15px] md:py-[25px] md:px-[20px] rounded-md w-full text-sm placeholder-[#838383]"
            />
            <ErrorMessage name="subject" component="div" className="text-red-500 text-start text-xs mt-1" />
          </div>

          {/* Message */}
          <div>
            <Field
              as="textarea"
              name="message"
              rows="5"
              placeholder="Message*"
              className="border border-[#0101011A] py-[15px] px-[15px] md:py-[25px] md:px-[20px] rounded-md w-full text-sm placeholder-[#838383]"
            />
            <ErrorMessage name="message" component="div" className="text-red-500 text-start text-xs mt-1" />
          </div>

          {/* Disclaimer */}
          <div className="flex items-start space-x-2 text-xs text-gray-600 leading-relaxed">
            <Field type="checkbox" name="consent" id="consent" className="mt-1 accent-black" />
            <label htmlFor="consent" className="italic text-start">
              By submitting this form, you consent to receive promotional messages from Lead Fusion HQ at the number provided, 
              including messages sent by autodialer. Msg & data rates apply. Msg frequency varies. Unsubscribe at any time 
              by replying STOP. Reply HELP for help. Your mobile information will not be sold or shared with 3rd parties for 
              promotional or marketing purposes. Read our Privacy Policy and Terms and Conditions.
            </label>
          </div>
          <ErrorMessage name="consent" component="div" className="text-red-500 text-start text-xs mt-1" />

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-black text-white text-sm px-6 py-3 rounded-md w-full md:w-auto mx-auto block"
          >
            SUBMIT MESSAGE
          </button>

        </Form>
      )}
    </Formik>

    </section>
  );
}
export default ContactForm;
