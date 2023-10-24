import axios from 'axios';
import { SerializableObject } from '@common/serialization';
import { FetchError } from '@/lib/error-types';
/**
 *
 * Retrieves content for the documentation website (react-app) from the static content directory `localhost:PORT/content/<filename>`
 *
 * In this application, all content is JSON
 *
 * @typeParam T - The type of the content, typically an object at the top level and not a primitive or array
 *
 *
 * @param filename - The name of the file to retrieve
 *
 * @returns - A promise that resolves to the content of the file as some subtype of `SerializableObject`
 *
 * @throws FetchError - Thrown for any axios specific or general error
 */
export async function fetchJSONContent<
  T extends SerializableObject = SerializableObject,
>(filename: string): Promise<T> {
  const url = `/content/${filename}`;
  try {
    const response = await axios.get<T>(url, {
      responseType: 'json',
    });
    const data = response.data;
    return data;
  } catch (error) {
    throw FetchError.interpretError(error);
  }
}

export async function fetchTextContent(filename: string): Promise<string> {
  const url = `/content/${filename}`;
  try {
    const response = await axios.get<string>(url, {
      responseType: 'text',
      responseEncoding: 'utf-8',
    });
    const data = response.data;
    return data;
  } catch (e) {
    throw FetchError.interpretError(e);
  }
}
