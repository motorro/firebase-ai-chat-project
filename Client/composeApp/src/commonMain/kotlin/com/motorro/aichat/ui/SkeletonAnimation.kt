package com.motorro.aichat.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection

@Composable
fun SkeletonAnimation(actualBrush: @Composable (Brush) -> Unit) {
    val shimmerColors = listOf(
        Color(0xFFE3E3E3).copy(alpha = 0.8f),
        Color(0xFFE3E3E3).copy(alpha = 0.2f),
        Color(0xFFE3E3E3).copy(alpha = 0.8f),
    )
    SkeletonAnimation(
        shimmerColors = shimmerColors,
        actualBrush = actualBrush
    )
}

@Composable
fun SkeletonAnimation(
    shimmerColors: List<Color>,
    actualBrush: @Composable (Brush) -> Unit
) {
    val transition = rememberInfiniteTransition()
    val translateAnim = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 1000,
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Reverse
        )
    )

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset.Zero,
        end = Offset(x = translateAnim.value, y = translateAnim.value)
    )

    actualBrush(brush)
}

object RoundParallelogramShape: Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density
    ): Outline {
        val trianglePath = Path().apply {
            moveTo(size.width / 10f, 0f)
            lineTo(size.width, 0f)
            lineTo(9f * size.width / 10f, size.height)
            lineTo(0f, size.height)
            close()
        }

        return Outline.Generic(
            path = trianglePath
        )
    }
}