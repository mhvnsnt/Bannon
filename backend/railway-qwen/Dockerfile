FROM ollama/ollama:latest

# Expose the default Ollama port
EXPOSE 11434

# Copy our startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Run the startup script which starts the server and pulls the model
ENTRYPOINT ["/start.sh"]
