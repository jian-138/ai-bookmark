package com.example.aicollector.domain.usecase

import com.example.aicollector.domain.repository.CollectionRepository
import javax.inject.Inject

class SubmitCollectionUseCase @Inject constructor(
    private val repository: CollectionRepository
) {
    suspend operator fun invoke(text: String, source: String? = null) =
        repository.submitCollection(text, source)
}
