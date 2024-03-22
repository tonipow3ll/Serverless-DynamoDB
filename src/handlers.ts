import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import { v4 } from "uuid";

const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'DirectoryTable'
export const createDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    body: JSON.stringify(dog),
  };
};

export const getDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dogId = event.pathParameters?.id;

  const output = await documentClient.get({
    TableName: tableName,
    Key: {
      dogID: dogId
    }
  }).promise()

  if (!output.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "no dog found" })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(output.Item)
  }
};

export const updateDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dogId = event.pathParameters?.id;
  const body = JSON.parse(event.body as string);

  const output = await documentClient.get({
    TableName: tableName,
    Key: {
      dogID: dogId
    }
  }).promise()

  if (!output.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "no dog with that id found" })
    }
  }

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
    body: JSON.stringify(dog)
  }

};

export const deleteDog = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dogId = event.pathParameters?.id;

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


};

export const getAllDogs = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const output = await documentClient.scan({
    TableName: tableName,
  }).promise()

  return {
    statusCode: 200,
    body: JSON.stringify(output.Items)
  }
};