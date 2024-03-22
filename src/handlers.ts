import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'DirectoryTable';
const headers = {
  "content-type": "application/json",
};

class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body))
  }
};

const handleError = (e: unknown) => {
  if (e instanceof SyntaxError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        errors: e
      })
    }
  }
  if (e instanceof HttpError) {
    return {
      statusCode: e.statusCode,
      headers,
      body: e.message,
    };
  }

  throw e;
};

const getById = async (dogID: string) => {
  const output = await documentClient.get({
    TableName: tableName,
    Key: {
      // dogID: id
      dogID
    }
  }).promise()

  if (!output.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "no dog found" })
    }
  }

  return output.Item;
}

export const createDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body as string);
    const dog = {
      dogID: v4(),
      ...body
    };

    await documentClient.put({
      TableName: tableName,
      Item: dog
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dog),
    };
  } catch (e) {
    return handleError(e)
  }
};

export const getDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {

    const dogId = event.pathParameters?.id;

    const output = await getById(dogId as string)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(output)
    }
  } catch (e) {
    return handleError(e)
  }
};

export const updateDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {

    const dogId = event.pathParameters?.id;
    const body = JSON.parse(event.body as string);

    await getById(dogId as string)

    const dog = {
      ...body,
      dogID: dogId
    }

    await documentClient.put({
      TableName: tableName,
      Item: dog
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dog)
    }
  } catch (e) {
    return handleError(e)
  }

};

export const deleteDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {

    const dogId = event.pathParameters?.id;
    
    await getById(dogId as string);

    await documentClient.delete({
      TableName: tableName,
      Key: {
        dogID: dogId
      }
    }).promise();
    
    return {
      statusCode: 200,
      body: "deleted"
    }
  } catch (e) {
    return handleError(e)
  }


};

export const getAllDogs = async (): Promise<APIGatewayProxyResult> => {
  const output = await documentClient.scan({
    TableName: tableName,
  }).promise()

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(output.Items)
  }
};