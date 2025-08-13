'use client'
import { Field, ErrorMessage } from 'formik';

const NotesTab = () => (
  <div className="space-y-4">
    <h3 className="text-xl font-medium">Campaign Notes</h3>
    <div>
      <Field
        as="textarea"
        name="note"
        rows={6}
        className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter any additional notes about this campaign..."
      />
      <ErrorMessage name="note" component="div" className="text-red-500 text-sm mt-1" />
    </div>
  </div>
);
export default NotesTab;