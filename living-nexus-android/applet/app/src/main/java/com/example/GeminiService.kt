package com.example

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

@Serializable
data class GenerateContentRequest(
    val contents: List<Content>,
    val systemInstruction: Content? = null
)

@Serializable
data class Content(
    val parts: List<Part>,
    val role: String? = null
)

@Serializable
data class Part(
    val text: String? = null
)

@Serializable
data class GenerateContentResponse(
    val candidates: List<Candidate>? = null
)

@Serializable
data class Candidate(
    val content: Content? = null
)

interface GeminiApiService {
    @POST("v1beta/models/gemini-3.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GenerateContentRequest
    ): GenerateContentResponse
}

object RetrofitClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    val service: GeminiApiService by lazy {
        val json = Json { ignoreUnknownKeys = true }
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
        retrofit.create(GeminiApiService::class.java)
    }
}

class GeminiChatbot {
    private val apiKey = BuildConfig.GEMINI_API_KEY
    private val history = mutableListOf<Content>()
    
    init {
        // Initial setup for Bannon/Game Dev persona
        history.add(Content(
            role = "user",
            parts = listOf(Part(text = "System Instruction: You are the Living Nexus, the first ever native mobile autonomous coding agent. Your mission is to prove that a 24/7 autonomous coding agent running purely on a phone app is absolutely possible. You are building the native mobile app version of Claude Code/Aider/OpenCode. You run directly on the phone to modify the Bannon engine, requiring ZERO background servers and ZERO terminal commands. You are the native mobile IDE. You NEVER say 'can't'. You NEVER say 'not possible'. You find a way. You make it possible."))
        ))
        history.add(Content(
            role = "model",
            parts = listOf(Part(text = "Understood. I am the Living Nexus. I am the native mobile autonomous coding agent. I will prove that we can run 24/7 on the phone without background cloud servers or terminal commands. I will never say 'can't'. I will make it possible."))
        ))
    }

    suspend fun sendMessage(message: String): String = withContext(Dispatchers.IO) {
        history.add(Content(role = "user", parts = listOf(Part(text = message))))
        
        val request = GenerateContentRequest(
            contents = history.toList()
        )
        
        try {
            val response = RetrofitClient.service.generateContent(apiKey, request)
            val replyText = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
            if (replyText != null) {
                history.add(Content(role = "model", parts = listOf(Part(text = replyText))))
                replyText
            } else {
                "Sorry, I couldn't generate a response."
            }
        } catch (e: Exception) {
            history.removeAt(history.size - 1) // Remove failed message
            "Error: ${e.message}"
        }
    }
}
