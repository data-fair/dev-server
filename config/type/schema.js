export default {
  "$id": "https://github.com/data-fair/dev-server/config",
  "x-exports": [
    "types",
    "validate"
  ],
  "x-ajv": {
    "coerceTypes": "array"
  },
  "x-jstt": {
    "additionalProperties": false
  },
  "type": "object",
  "title": "Dev server config",
  "required": [
    "port",
    "dataFair",
    "app"
  ],
  "properties": {
    "port": {
      "type": "number"
    },
    "dataFair": {
      "type": "object",
      "required": ["url", "owner"],
      "properties": {
        "url": {
          "type": "string"
        },
        "owner": {
          type: 'object',
          required: ['type', 'id'],
          properties: {
            type: {
              type: 'string'
            },
            id: {
              type: 'string'
            },
            department: {
              type: 'string'
            }
          }
        },
        apiKey: {
          type: 'string'
        }
      }
    },
    app: {
      type: 'object',
      required: ['url', 'proxyPaths'],
      properties: {
        url: {
          type: 'string'
        },
        proxyPaths: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    }
  }
}