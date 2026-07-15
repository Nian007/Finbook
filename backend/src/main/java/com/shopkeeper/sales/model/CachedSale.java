package com.shopkeeper.sales.model;

import com.redis.om.spring.annotations.Document;
import com.redis.om.spring.annotations.Indexed;
import com.redis.om.spring.annotations.SchemaFieldType;
import org.springframework.data.annotation.Id;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;
import redis.clients.jedis.search.schemafields.VectorField.VectorType;

@Document
public class CachedSale {

    @Id
    private String id;

    @Indexed
    private String transcript;

    private String jsonResponse;

    @Indexed(schemaFieldType = SchemaFieldType.VECTOR, algorithm = VectorAlgorithm.HNSW, type = VectorType.FLOAT32, dimension = 768)
    private float[] transcriptEmbedding;

    public CachedSale() {}

    public CachedSale(String transcript, float[] transcriptEmbedding, String jsonResponse) {
        this.transcript = transcript;
        this.transcriptEmbedding = transcriptEmbedding;
        this.jsonResponse = jsonResponse;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTranscript() {
        return transcript;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getJsonResponse() {
        return jsonResponse;
    }

    public void setJsonResponse(String jsonResponse) {
        this.jsonResponse = jsonResponse;
    }

    public float[] getTranscriptEmbedding() {
        return transcriptEmbedding;
    }

    public void setTranscriptEmbedding(float[] transcriptEmbedding) {
        this.transcriptEmbedding = transcriptEmbedding;
    }
}
