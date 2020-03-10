﻿using System.Text.Json.Serialization;

namespace Sequel
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum DBMS
    {
        MySQL,
        MariaDB,
        Oracle,
        PostgreSQL,
        SQLite,
        SQLServer,
        Cassandra,
        CockroachDB
    }
}