CREATE TABLE IF NOT EXISTS idemia_devices_queue ON CLUSTER main (
    deviceId UInt64,
    moment DateTime,
    latitude float,
    longitude float,
    activity LowCardinality(String),
    registryId UInt64
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'idemia-a1uwhsr2-kafka-bootstrap.kafka.svc:9092',
    kafka_topic_list = 'idemia-oslr1xad',
    kafka_group_name = 'clickhouse-idemia',
    kafka_format = 'JSONEachRow';

CREATE TABLE IF NOT EXISTS idemia_devices ON CLUSTER main (
    deviceId UInt64 Codec(DoubleDelta, LZ4),
    moment DateTime Codec(DoubleDelta, LZ4),
    latitude float Codec(DoubleDelta, LZ4),
    longitude float Codec(DoubleDelta, LZ4),
    activity LowCardinality(String) Codec(LZ4),
    registryId UInt64 Codec(DoubleDelta, LZ4),
    date ALIAS toDate(moment)
) ENGINE = ReplicatedMergeTree PARTITION BY toYYYYMM(moment)
ORDER BY (deviceId, activity, moment);
CREATE MATERIALIZED VIEW idemia_devices_mv TO idemia_devices AS
SELECT *
FROM idemia_devices_queue;